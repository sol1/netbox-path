from setuptools import find_packages, setup

setup(
    name='netbox_path',
    version = '0.3.6',
    description='Create visual and queryable maps of logical paths within your infrastructure',
    install_requires=[],
    url='https://github.com/sol1/netbox-path',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
)
